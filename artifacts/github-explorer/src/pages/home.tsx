import { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin, Building, Calendar, Star, GitFork, BookOpen, AlertCircle, Eye, GitBranch, Github } from "lucide-react";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { 
  useGetGithubUser, getGetGithubUserQueryKey,
  useGetGithubRepos, getGetGithubReposQueryKey,
  useGetGithubLanguages, getGetGithubLanguagesQueryKey 
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
type GetGithubReposSort = "stars" | "name" | "updated";
type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  html_url: string;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  created_at: string;
  fork: boolean;
  topics: string[];
  visibility?: string;
  watchers_count: number;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#d946ef', '#ec4899', '#14b8a6'];

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const { recentSearches, addSearch } = useRecentSearches();
  
  const [sort, setSort] = useState<GetGithubReposSort>("stars");
  const [page, setPage] = useState(1);
  
  const [accumulatedRepos, setAccumulatedRepos] = useState<GithubRepo[]>([]);
  const prevSortRef = useRef<GetGithubReposSort>(sort);
  const prevUsernameRef = useRef<string>(activeUsername);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    const newUsername = searchInput.trim();
    if (newUsername !== activeUsername) {
      setActiveUsername(newUsername);
      addSearch(newUsername);
      setPage(1);
      setAccumulatedRepos([]);
    }
  };

  const handleChipClick = (username: string) => {
    setSearchInput(username);
    if (username !== activeUsername) {
      setActiveUsername(username);
      addSearch(username);
      setPage(1);
      setAccumulatedRepos([]);
    }
  };

  const handleSortChange = (newSort: GetGithubReposSort) => {
    setSort(newSort);
    setPage(1);
    setAccumulatedRepos([]);
  };

  const { data: user, isLoading: isUserLoading, error: userError } = useGetGithubUser(
    { username: activeUsername },
    { query: { enabled: !!activeUsername, queryKey: getGetGithubUserQueryKey({ username: activeUsername }) } }
  );

  const { data: reposData, isLoading: isReposLoading, error: reposError } = useGetGithubRepos(
    { username: activeUsername, sort, page, per_page: 30 },
    { query: { enabled: !!activeUsername, queryKey: getGetGithubReposQueryKey({ username: activeUsername, sort, page, per_page: 30 }) } }
  );
  
  useEffect(() => {
    if (reposData?.repos) {
      if (page === 1) {
        setAccumulatedRepos(reposData.repos);
      } else {
        setAccumulatedRepos(prev => {
          const newIds = new Set(reposData.repos.map(r => r.id));
          const filteredPrev = prev.filter(r => !newIds.has(r.id));
          return [...filteredPrev, ...reposData.repos];
        });
      }
    }
  }, [reposData, page]);

  const { data: languagesData, isLoading: isLanguagesLoading } = useGetGithubLanguages(
    { username: activeUsername },
    { query: { enabled: !!activeUsername, queryKey: getGetGithubLanguagesQueryKey({ username: activeUsername }) } }
  );

  const renderError = (error: any) => {
    if (!error) return null;
    let message = error?.error || "An unknown error occurred";
    if (error?.rateLimitReset) {
      const resetTime = new Date(error.rateLimitReset * 1000).toLocaleTimeString();
      message += `. Rate limit resets at ${resetTime}.`;
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-8 text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="font-medium text-lg">Error loading data</p>
        <p className="text-sm opacity-80">{message}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4 max-w-5xl">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight mr-4">
            <Github className="w-6 h-6" />
            <span className="hidden sm:inline-block">RepoExplorer</span>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search GitHub username..." 
                className="pl-9 bg-secondary/50 border-border focus-visible:ring-primary h-10"
              />
            </div>
            <Button type="submit" disabled={!searchInput.trim()} className="h-10">Search</Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 max-w-5xl">
        {!activeUsername && !isUserLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-secondary/80 rounded-full flex items-center justify-center mb-6 shadow-xl border border-border/50">
              <Github className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Explore GitHub Profiles</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
              Search for a developer to instantly view their repositories, language breakdown, and profile stats in a dense, precise interface.
            </p>
            
            {recentSearches.length > 0 && (
              <div className="w-full max-w-md">
                <p className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Recent Searches</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentSearches.map(username => (
                    <Button 
                      key={username} 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleChipClick(username)}
                      className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {username}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeUsername && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {recentSearches.length > 0 && (
               <div className="flex flex-wrap gap-2 items-center text-sm">
                  <span className="text-muted-foreground">Recent:</span>
                  {recentSearches.filter(s => s.toLowerCase() !== activeUsername.toLowerCase()).slice(0, 4).map(username => (
                    <Badge 
                      key={username} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-secondary cursor-pointer transition-colors"
                      onClick={() => handleChipClick(username)}
                    >
                      {username}
                    </Badge>
                  ))}
               </div>
            )}
            
            {userError ? renderError(userError) : null}
            
            {isUserLoading ? (
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </Card>
            ) : user ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 overflow-hidden border-border/50 shadow-sm relative">
                  {user.cached && (
                    <Badge variant="secondary" className="absolute top-4 right-4 text-xs font-normal opacity-50">
                      Cached
                    </Badge>
                  )}
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <img 
                        src={user.avatar_url} 
                        alt={user.login} 
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover ring-2 ring-border" 
                      />
                      <div className="flex-1 space-y-4">
                        <div>
                          <h1 className="text-3xl font-bold tracking-tight">{user.name || user.login}</h1>
                          <a href={user.html_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mt-1">
                            @{user.login}
                          </a>
                        </div>
                        
                        {user.bio && <p className="text-sm leading-relaxed">{user.bio}</p>}
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
                          {user.location && (
                            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {user.location}</div>
                          )}
                          {user.company && (
                            <div className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {user.company}</div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" /> Joined {format(new Date(user.created_at), 'MMM yyyy')}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{user.followers}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Followers</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{user.following}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Following</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{user.public_repos}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Repos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm relative">
                  <CardHeader className="pb-2 pt-6 px-6">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Language Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[220px] flex items-center justify-center">
                    {isLanguagesLoading ? (
                      <Skeleton className="w-32 h-32 rounded-full" />
                    ) : languagesData?.languages && languagesData.languages.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={languagesData.languages.slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="count"
                            nameKey="language"
                            stroke="none"
                          >
                            {languagesData.languages.slice(0, 6).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">No language data</div>
                    )}
                  </CardContent>
                  {languagesData?.languages && languagesData.languages.length > 0 && (
                    <div className="px-6 pb-6 flex flex-wrap gap-2 justify-center">
                      {languagesData.languages.slice(0, 4).map((lang, i) => (
                        <div key={lang.language} className="flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {lang.language}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ) : null}

            {activeUsername && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl font-bold tracking-tight">Repositories</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Select value={sort} onValueChange={(v) => handleSortChange(v as GetGithubReposSort)}>
                      <SelectTrigger className="w-[140px] h-8 bg-secondary/30">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stars">Stars</SelectItem>
                        <SelectItem value="updated">Last Updated</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {reposError ? renderError(reposError) : null}

                {isReposLoading && page === 1 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="p-5">
                        <Skeleton className="h-6 w-2/3 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : accumulatedRepos.length === 0 && !isReposLoading ? (
                   <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-lg">
                      This user has no public repositories.
                   </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accumulatedRepos.map((repo) => (
                        <RepoCard key={repo.id} repo={repo} />
                      ))}
                    </div>
                    
                    {reposData?.has_more && (
                      <div className="flex justify-center pt-4">
                        <Button 
                          variant="secondary" 
                          onClick={() => setPage(p => p + 1)}
                          disabled={isReposLoading}
                          className="min-w-[200px]"
                        >
                          {isReposLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Load More
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function RepoCard({ repo }: { repo: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      className={`border-border/50 shadow-sm transition-all duration-200 cursor-pointer overflow-hidden
        ${expanded ? 'ring-1 ring-primary/50 bg-secondary/10' : 'hover:border-border hover:bg-secondary/20'}
      `}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4 mb-2">
          <a 
            href={repo.html_url} 
            target="_blank" 
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-lg font-semibold text-primary hover:underline underline-offset-4 flex items-center gap-2 truncate"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">{repo.name}</span>
          </a>
          <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
            {repo.stargazers_count > 0 && (
              <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Star className="w-4 h-4" /> <span>{repo.stargazers_count}</span>
              </div>
            )}
            {repo.forks_count > 0 && (
              <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <GitFork className="w-4 h-4" /> <span>{repo.forks_count}</span>
              </div>
            )}
          </div>
        </div>

        {repo.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {repo.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {repo.language && (
            <div className="flex items-center gap-1.5 font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-primary/80" />
              {repo.language}
            </div>
          )}
          <div className="flex items-center gap-1">
            Updated {format(new Date(repo.updated_at), 'MMM d, yyyy')}
          </div>
        </div>
        
        {/* Expanded Content */}
        <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="pt-4 border-t border-border/40 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" /> Open Issues: <span className="text-foreground">{repo.open_issues_count}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="w-4 h-4" /> Watchers: <span className="text-foreground">{repo.watchers_count}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch className="w-4 h-4" /> Default: <span className="text-foreground">{repo.default_branch}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" /> Created: <span className="text-foreground">{format(new Date(repo.created_at), 'MMM yyyy')}</span>
                </div>
              </div>
              
              {repo.topics && repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {repo.topics.map((topic: string) => (
                    <Badge key={topic} variant="secondary" className="bg-secondary/50 hover:bg-secondary text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
